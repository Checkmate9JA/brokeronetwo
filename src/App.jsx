import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Pages />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 