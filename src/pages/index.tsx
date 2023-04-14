import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Layout from "~/lib/layout";
import { mainMenu } from "~/lib/menus";
import Link from "next/link";

const Home: NextPage = () => {
  const { data: courses } = api.getCourses.useQuery()

  return (
    <>
      <Head>
        <title>Cuaderno de comunicados</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout
        title="Inicio"
        menu={mainMenu(courses)}
        nav={[]}
      >
        <Link
          href="/nueva-comunicacion"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-2 text-center"
        >
          Nueva comunicación
        </Link>
      </Layout>
    </>
  );
};

export default Home