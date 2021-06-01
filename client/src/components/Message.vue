<template>
  <div v-if="meta.server" class="message">
    <div class="msg-server">{{ author }} {{ message }}</div>
  </div>
  <div v-else class="message">
    <div class="msg-author">
      {{ author }}
    </div>
    <div class="msg-body">
      {{ message }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    author: String,
    message: String,
    meta: {
      server: Boolean,
    },
  },
};
</script>
