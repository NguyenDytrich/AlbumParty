<template>
  <div class="message">
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
  },
};
</script>
