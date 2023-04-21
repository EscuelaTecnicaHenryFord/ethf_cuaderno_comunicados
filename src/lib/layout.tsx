import { signIn, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"

interface Props {
    children: React.ReactNode
    title: string
    nav: {
        label: string
        href: string
    }[]
    menu: {
        label: React.ReactNode
        href: string
    }[]
}

export default function AuthedLayout({ title, children, menu, nav }: Props) {

    const { data: session, status } = useSession()

    const isLoading = status === "loading"

    if (isLoading) {
        return <Layout
            title={title}
            menu={menu}
            nav={nav}
        >
            <h1 className="text-center mt-5 font-xl">
                Cargando...
            </h1>
        </Layout>
    }

    if (status === 'unauthenticated') {
        return <Layout
            title={title}
            menu={[{
                label: "Iniciar sesión",
                href: "/api/auth/signin/azure-ad"
            }]}
            nav={[]}
        >
            <h1 className="text-center mt-5 font-xl">
                No tienes permiso para ver esta página
            </h1>
            <Link
                href="/api/auth/signin/azure-ad"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-2 text-center"
                onClick={e => {
                    e.preventDefault()
                    void signIn('azure-ad')
                }}
            >
                Ingresar al sistema
            </Link>
        </Layout>
    }

    return <Layout
        title={title}
        menu={menu}
        nav={nav}
    >
        {children}
    </Layout>
}

function Layout({ title, children, menu, nav }: Props) {
    return <div className="mx-auto flex flex-col space-y-6">
        <header className="mx-[1.5rem] sticky top-0 z-40 bg-white">
            <div className="flex h-16 items-center justify-between border-b border-b-slate-200 py-4">
                <div className="flex gap-6 md:gap-10">
                    <Link className="hidden items-center space-x-2 md:flex" href="/">
                        {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-command">
                            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                        </svg> */}
                        <Image src='/icon.svg' alt="" width={24} height={24} />
                        <span className="hidden font-bold sm:inline-block">Cuaderno</span>
                    </Link>
                    <nav className="hidden gap-6 md:flex">
                        {nav?.map((option, i) => <Link
                            key={i}
                            className="flex items-center text-lg font-semibold text-slate-600 sm:text-sm" href={option.href}
                        >{option.label}</Link>)}
                    </nav>
                    <button className="flex items-center space-x-2 md:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-command">
                            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                        </svg>
                        <span className="font-bold">Menu</span>
                    </button>
                </div>
            </div>
        </header>
        <div className="mx-[1.5rem] grid gap-12 md:grid-cols-[200px_1fr]">
            <aside className="hidden w-[200px] flex-col md:flex">
                <nav className="grid items-start gap-2">
                    {menu.map((item, i) => <MenuItem key={i} {...item} />)}
                </nav>
            </aside>
            <main className="flex w-full flex-1 flex-col overflow-hidden">
                {children}
            </main>
        </div>
    </div>
}

export function MenuItem(props: { label: React.ReactNode, href: string }) {
    return <Link href={props.href}>
        <span className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 transparent">
            <span className="font-bold">{props.label}</span>
        </span>
    </Link>
}   