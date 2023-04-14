import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Layout from "~/lib/layout";
import { useMainMenu } from "~/lib/menus";
import Link from "next/link";
import Communications from "~/lib/components/Communications";

const Home: NextPage = () => {
  const { data: courses } = api.getCourses.useQuery()
  const { data: communications } = api.getCommunications.useQuery({ mineOnly: false })

  const mainMenu = useMainMenu(courses)

  return (
    <>
      <Head>
        <title>Todas las comunicaciones</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout
        title="Inicio"
        menu={mainMenu}
        nav={[]}
      >
        <h1 className="text-xl">Todas las comunicaciones</h1>
        <Link
          href="/nueva-comunicacion"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-2 text-center mb-2"
        >
          Nueva comunicación
        </Link>
        {communications?.length === 0 && <p>
          No hay ninguna comunicación
        </p>}
        {communications && <Communications communications={communications} />}
      </Layout>
    </>
  );
};

export default Home