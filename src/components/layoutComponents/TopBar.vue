<template>
  <header class="top-bar">
    <div class="left"></div>
    <div class="center">
     고객을 담다 <br><span class="brand">客談</span>
    </div>

    <div class="right">
      <span class="user">userName</span>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  height: 56px;
  background: #5b6b7a;
  color: white;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 20px;
  border-bottom: 5px solid #6a8daf;
}

.center {
  justify-self: center;
  font-weight: 400;
  font-size: 12px;
}

.brand {
  font-weight: 400;
  margin-left: 15px;
}

.right {
  justify-self: end;
  font-size: 14px;
  opacity: 0.9;
}
</style>
