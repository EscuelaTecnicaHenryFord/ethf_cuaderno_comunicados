import { type NextPage } from "next";
import Head from "next/head";

import Layout from "~/lib/layout";
import { useRouter } from "next/router";
import { useCoursesSubMenu } from "~/lib/menus";
import Link from "next/link";
import { api } from "~/utils/api";
import { useMemo } from "react";
import Communications from "~/lib/components/Communications";

const Home: NextPage = () => {
  const router = useRouter()
  const courseYear = parseInt(router.query.course?.toString() || '0')

  const { data: communications } = api.getCommunications.useQuery()

  const filteredCommunications = useMemo(() => {
    return communications?.filter(communication => communication.subject?.courseYear === courseYear)
  }, [communications, courseYear])

  const menu = useCoursesSubMenu(courseYear)

  return (
    <>
      <Head>
        <title>{courseYear}° año</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout
        title="Inicio"
        menu={menu}
        nav={[]}
      >
        <h1 className="text-lg">{courseYear}° año</h1>
        <Link
          href={"/nueva-comunicacion?curso=" + courseYear.toString()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-2 text-center"
        >
          Nueva comunicación
        </Link>
        {(filteredCommunications && filteredCommunications.length > 0) && <>
          <h2 className="text-lg mt-2">Últimas comunicaciones</h2>
          <Communications communications={filteredCommunications} />
        </>}
      </Layout>
    </>
  );
};

export default Home