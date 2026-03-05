import PublicNavBar from './PublicNavBar'

export default function PublicLayout({ children }) {
  return (
    <>
      <PublicNavBar />
      <div className="public-layout">
        {children}
      </div>
    </>
  )
}
