<template>
  <div id="parties">
    <div class="header">
      <h1>Live Parties</h1>
      <a class="button" @click="createNewParty">Host a new party</a>
    </div>
    <div id="other">
      <ul>
        <li v-for="p in parties" :key="p.id">
          <div>
            {{ p.owner }} listening to <i>{{ p.track }} by {{ p.artists }}</i>
          </div>
          <router-link :to="p.id" class="button">Join</router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { defineComponent, onBeforeMount, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default defineComponent({
  setup() {
    const router = useRouter();
    const parties = reactive([]);
    onBeforeMount(async () => {
      try {
        const { data } = await axios.get('http://localhost:3000/parties');
        const _array = data.map((i) => {
          return {
            id: `/${i.uuid}`,
            owner: i.owner,
            track: i.currentlyPlaying.trackName,
            artists: i.currentlyPlaying.artists.join(' '),
          };
        });
        for (let i of _array) {
          parties.push(i);
        }
        console.log(parties);
      } catch (err) {
        console.error(err);
      }
    });
    return { router, parties };
  },
  methods: {
    async createNewParty() {
      try {
        const { data } = await axios.post('http://localhost:3000/parties');
        this.router.push(`/${data}`);
      } catch (err) {
        console.log(err);
      }
    },
  },
});
</script>
