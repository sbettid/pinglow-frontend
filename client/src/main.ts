import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import "vuetify/styles/main.css"
import '@mdi/font/css/materialdesignicons.css'  // <- ✅ This is the missing piece

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'system', // auto-detects system theme (light/dark)
    },
    icons: {
        defaultSet: 'mdi',
    },
})

const app = createApp(App);

app.use(vuetify);

app.mount('#app');
