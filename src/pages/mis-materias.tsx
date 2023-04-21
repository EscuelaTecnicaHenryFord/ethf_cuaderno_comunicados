import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Layout from "~/lib/layout";
import { mainMenu, useMainMenu } from "~/lib/menus";
import Link from "next/link";

const Home: NextPage = () => {
  const { data: courses } = api.getCourses.useQuery()
  const { data: subjects } = api.getMySubjects.useQuery()

  const mainMenu = useMainMenu(courses)

  console.log(subjects)
  return (
    <>
      <Head>
        <title>Mis materias</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout
        title="Inicio"
        menu={mainMenu}
        nav={[]}
      >
        {subjects?.length === 0 && <p>No hay materias</p>}
        {subjects?.map(subject => (<Link key={subject.code}
          className="grid grid-cols-[75px,1fr] gap-4] p-2 px-4 hover:bg-gray-100 rounded-md border mt-2"
          href={`/materia/${subject.code}`}
        >
          <p>{subject.courseYear}° año</p>
          <p>{subject.name}</p>
        </Link>))}
      </Layout>
    </>
  );
};

export default Home