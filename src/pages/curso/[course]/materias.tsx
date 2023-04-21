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
    const { data: subjects } = api.getSubjectsOfYear.useQuery(courseYear)

    const menu = useCoursesSubMenu(courseYear, code)

    return (
        <>
            <Head>
                <title>Materias de {courseYear}°</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Layout
                title="Inicio"
                menu={menu}
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
                <div className="h-5 w-2"></div>
            </Layout >
        </>
    );
};

export default Home