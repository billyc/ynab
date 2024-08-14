<template>
  <YNAB />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import YNAB from './components/YNAB.vue'

const MyYNAB = defineComponent({
  components: { YNAB },
})

export default MyYNAB
</script>

<style>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.flex-row {
  display: flex;
  flex-direction: row;
}
.flex-col {
  display: flex;
  flex-direction: column;
}
.flex1 {
  flex: 1;
}
.gap25 {
  gap: 0.25rem;
}
.gap5 {
  gap: 0.5rem;
}
.caps {
  text-transform: uppercase;
}
.clickable {
  cursor: pointer;
}
.grid {
  display: grid;
}
</style>
