import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Layout from "~/lib/layout";
import { useMainMenu } from "~/lib/menus";
import Link from "next/link";
import { useUserRole } from "./util/useUserRole";
import { signIn, signOut, useSession } from "next-auth/react";

const Home: NextPage = () => {
  const { data: courses } = api.getCourses.useQuery()

  const role = useUserRole()
  const { data: session } = useSession()

  const mainMenu = useMainMenu(courses)

  return (
    <>
      <Head>
        <title>Cuaderno de comunicados</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout
        title="Inicio"
        menu={mainMenu}
        nav={[]}
      >
        <div className="border rounded-md p-2">
          <p className="text-md">Ingresaste como {session?.user.email}</p>
          <p className="text-sm">Docente: {role.isTeacher ? 'SI' : 'NO'}</p>
          <p className="text-sm">Gestor: {role.isAdmin ? 'SI' : 'NO'}</p>
          <div className="flex gap-2">
            <Link href="/api/auth/signin/azure-ad" className="block text-blue-500" onClick={e => {
              e.preventDefault()
              signIn('azure-ad')
            }}>Cambiar cuenta</Link>
            <Link href="/api/auth/signout" className="block text-blue-500"
              onClick={e => {
                e.preventDefault()
                signOut()
              }}
            >Salir</Link>
          </div>
        </div>
        <Link
          href="/nueva-comunicacion"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-2 text-center"
        >
          Nueva comunicación
        </Link>
        {role.isAdmin && <Link
          href="/comunicaciones"
          className="border border-blue-500 hover:bg-blue-100 text-blue-500 font-bold py-2 px-4 rounded my-2 text-center"
        >
          Comunicaciones
        </Link>}
      </Layout>
    </>
  );
};

export default Home