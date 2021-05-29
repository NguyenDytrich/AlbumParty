<template>
  <div id="party">
    <div id="chat">
      <h1>Live Chat</h1>
      <div id="log">
        <Message v-for="m in chat" :key="m.id" :author="m.author" :message="m.message" />
      </div>
      <div id="new-msg">
        <span>></span
        ><input type="text" placeholder="send a message..." v-model="newMessage" @keydown.enter="sendMessage" />
      </div>
    </div>
    <Player :title="currentTrack.trackName" :artists="currentTrack.artists" :imgUrl="currentTrack.images[0].url" />
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

export default defineComponent({
  setup() {
    const router = useRouter();
    const route = useRoute();
    const socket = io('http://localhost:3000');
    const store = useStore(key);

    const chat = ref([] as Msg[]);
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

    onBeforeMount(async () => {
      const uuid = route.params.partyId;
      try {
        const res = await axios.get(`http://localhost:3000/parties/${uuid}`);
        const { contextUri, contextUrl, images, albumName, artists, trackName, trackId } = res.data.currentlyPlaying;
        console.log(res);
        if (res.status == 200) {
          socket.emit('create-party', uuid);
          currentTrack.contextUri = contextUri;
          currentTrack.contextUrl = contextUrl;
          currentTrack.albumName = albumName;
          currentTrack.artists = artists;
          currentTrack.trackName = trackName;
          currentTrack.images = images;
          currentTrack.trackId = trackId;
        }
      } catch {
        socket.disconnect();
        router.push('/');
      }
    });
    socket.on('message', (args) => {
      chat.value.push(args);
    });

    return { socket, router, route, store, chat, newMessage, currentTrack };
  },
  methods: {
    sendMessage() {
      this.socket.emit('new-message', {
        room: this.route.params.partyId,
        author: this.store.state.user,
        message: this.newMessage,
      });
      this.newMessage = '';
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
  height: 100%;
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
