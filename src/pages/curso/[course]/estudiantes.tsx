import { type NextPage } from "next";
import Head from "next/head";

import Layout from "~/lib/layout";
import { useRouter } from "next/router";
import { coursesSubMenu, useCoursesSubMenu } from "~/lib/menus";
import { api } from "~/utils/api";
import Link from "next/link";

const Home: NextPage = () => {
  const router = useRouter()
  const courseYear = parseInt(router.query.course?.toString() || '0')
  const code = router.query.materia?.toString()
  const { data: students } = api.getStudentsOf.useQuery(courseYear)

  const menu = useCoursesSubMenu(courseYear, code)

  return (
    <>
      <Head>
        <title>Estudiantes de {courseYear}°</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout
        title="Inicio"
        menu={menu}
        nav={[]}
      >
        {students?.map(student => (<Link key={student.enrolment}
          className="grid grid-cols-[75px,1fr] gap-4] p-2 hover:bg-gray-100 rounded-sm"
          href={"/estudiante/" + student.enrolment + (code ? "?materia=" + code : "")}
        >
          <p>{student.enrolment}</p>
          <p>{student.name}</p>
        </Link>))}
      </Layout >
    </>
  );
};

export default Home