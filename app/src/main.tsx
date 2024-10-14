// src/main.tsx
import React from "react"
import ReactDOM from "react-dom/client"
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react"
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { theme } from "./theme"
import { AuthLayout } from "./layouts/auth-layout"
import { PageRefreshSpinner } from "./layouts/page-refresh-spinner"
import { AppLayout } from "./layouts/app-layout"
import { AppShell } from "./layouts/app-shell"

const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: <AppShell />,
        children: [
          { path: "", lazy: () => import("./views/home-view") },
          { path: "settings", lazy: () => import("./views/settings-view") }
        ]
      },
      {
        path: "projects/:projectId",
        lazy: () => import("./views/project-view")
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to={`/`} replace />
  }
])

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <RouterProvider
        router={router}
        fallbackElement={<PageRefreshSpinner />}
      />
    </ChakraProvider>
  </React.StrictMode>
)

