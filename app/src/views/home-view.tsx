import { HomeLayout } from "../components/home-layout"

const HomeView: React.FC = () => {
  return (
    <>
      <HomeLayout />
    </>
  )
}
export function Component() {
  return <HomeView />
}

Component.displayName = "HomeView"
