import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Layout from "~/lib/layout";
import { mainMenu } from "~/lib/menus";
import Link from "next/link";
import Communications from "~/lib/components/Communications";

const Home: NextPage = () => {
  const { data: courses } = api.getCourses.useQuery()
  const { data: communications } = api.getMyCommunications.useQuery()

  return (
    <>
      <Head>
        <title>Mis comunicaciones</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout
        title="Inicio"
        menu={mainMenu(courses)}
        nav={[]}
      >
        {communications && <Communications communications={communications} />}
      </Layout>
    </>
  );
};

export default Home