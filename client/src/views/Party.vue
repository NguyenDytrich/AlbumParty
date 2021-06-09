<template>
  <div id="party">
    <div id="chat">
      <h1>Live Chat</h1>
      <div id="log">
        <div id="viewport">
          <Message v-for="m in chat" :key="m.id" :author="m.author" :message="m.message" :meta="m.meta" />
        </div>
      </div>
      <div id="new-msg">
        <span>></span
        ><input type="text" placeholder="send a message..." v-model="newMessage" @keydown.enter="sendMessage" />
      </div>
    </div>
    <Player :title="currentTrack.trackName" :artists="currentTrack.artists" :imgUrl="imgUrl" />
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, ref, reactive } from 'vue';

import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { key } from '@/store';

import Message from '@/components/Message.vue';
import Player from '@/components/Player.vue';

import axios from 'axios';
import { io } from 'socket.io-client';

interface Msg {
  id: number;
  author: string;
  message: string;
}

const baseUrl = process.env.VUE_APP_API_URL ?? '';

export default defineComponent({
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useStore(key);

    const socket = io(baseUrl, {
      path: process.env.VUE_APP_API_SOCKET_URL ?? '/socket.io',
      auth: {
        user: store.state.user,
      },
    });

    const chat = ref([] as Msg[]);
    const imgUrl = ref('');
    const newMessage = ref('');
    let currentTrack = reactive({
      contextUri: '',
      contextUrl: '',
      images: [],
      albumName: '',
      artists: [],
      trackName: '',
      trackId: '',
    });

    const updatePlayer = async () => {
      const uuid = route.params.partyId;
      const res = await axios.get(`${baseUrl}/parties/${uuid}`);
      const { contextUri, contextUrl, images, albumName, artists, trackName, trackId } = res.data.currentlyPlaying;
      if (res.status == 200) {
        // socket.emit('join-party', { uuid, user: store.state.user });

        // Assign all properties like this otherwise strings won't update
        currentTrack.contextUri = contextUri;
        currentTrack.contextUrl = contextUrl;
        currentTrack.albumName = albumName;
        currentTrack.artists = artists;
        currentTrack.trackName = trackName;
        currentTrack.images = images;
        currentTrack.trackId = trackId;

        // Set the imgUrl separate of the currentTrack object otherwise
        // bad things will happen.
        imgUrl.value = images[0].url;
        return 200;
      } else {
        throw new Error();
      }
    };

    onBeforeMount(async () => {
      const uuid = route.params.partyId;
      try {
        const status = await updatePlayer();
        if (status == 200) {
          socket.emit('join-party', { uuid, user: store.state.user });
        }
      } catch {
        socket.disconnect();
        console.error('Error retrieving data from server');
        router.push('/');
      }
    });
    socket.on('message', (args) => {
      chat.value.push(args);
    });
    socket.on('update-player', async () => {
      console.log('updating player...');
      try {
        await updatePlayer();
      } catch (err) {
        console.error('Error updating player');
      }
    });

    return { socket, router, route, store, chat, newMessage, currentTrack, imgUrl };
  },
  methods: {
    sendMessage() {
      if (this.newMessage !== '') {
        this.socket.emit('new-message', {
          room: this.route.params.partyId,
          author: this.store.state.user,
          message: this.newMessage,
        });
        this.newMessage = '';
      }
    },
  },
  components: {
    Player,
    Message,
  },
});
</script>

<style lang="scss">
$color0: #3c3c3c;
$color1: #486665;
$color2: #c5dca0;
$color3: #8e7c93;
$color4: #d0a6c0;
$color5: #f6c0d0;

#chat,
#player {
  h1 {
    margin-top: 0;
  }
}

input {
  border: none;
  background-image: none;
  background-color: transparent;
  box-shadow: none;
  width: 100%;
  color: $color0;
  font-family: 'Roboto';
  font-size: 0.85em;

  &:focus {
    outline: none;
  }
}

#log {
  border: 2px solid $color3;
  border-bottom: none;
  padding: 1em;
  overflow: auto;
  height: 0px;
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
}

#viewport {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

#new-msg {
  color: $color0;
  padding: 0.25em 1em;
  background-color: $color5;
  display: flex;
  gap: 0.5em;
}

.message {
  margin-bottom: 0.5em;
  font-weight: 300;
}

.msg-author {
  color: $color5;
}

.msg-body {
  padding-left: 1em;
  color: $color3;
}

.msg-server {
  font-style: italic;
  background-color: $color4;
  color: $color0;
  padding: 0.25em 1em;
  text-align: center;
}

#party {
  display: grid;
  grid-template-columns: 20em auto;
  gap: 5em;
}

#chat {
  grid-column-start: 1;
  display: flex;
  flex-direction: column;
}

#player {
  grid-column-start: 2;
}
</style>
