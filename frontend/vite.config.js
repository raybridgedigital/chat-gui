import { defineConfig } from 'vite'
import { execSync } from 'child_process'

const gitVersion = execSync(
  'git describe --tags --always',
  { cwd: '..' }
).toString().trim()

import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(
      gitVersion
    ),
  },
  plugins: [react()],
})
