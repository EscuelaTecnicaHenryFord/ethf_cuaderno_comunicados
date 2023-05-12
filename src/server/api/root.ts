import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { settings } from "~/settings.mjs";
import { z } from "zod";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  getCourses: protectedProcedure.query(() => {
    return settings.getCourses();
  }),
  getAllSubjects: protectedProcedure.query(() => {
    return settings.getAllSubjects();
  }),
  getStudentsOf: protectedProcedure.input(z.number()).query(({ input }) => {
    return settings.getStudentsOf(input);
  }),
  getAllStudents: protectedProcedure.query(() => {
    return settings.getAllStudents();
  }),
  getStudent: protectedProcedure.input(z.string()).query(({ input }) => {
    return settings.getStudentByEnrolment(input);
  }),
  getMySubjects: protectedProcedure.query(({ ctx }) => {
    return settings.getSubjectsOf(ctx.session.user.email || '');
  }),
  getSubjectsOfYear: protectedProcedure.input(z.number()).query(async ({ input, ctx }) => {
    const role = await settings.getUserRole(ctx.session.user.email || '');
    return await settings.getSubjectsOfYear(input);
  }),
  getSubject: protectedProcedure.input(z.string()).query(({ input }) => {
    return settings.getSubject(input);
  }),
  getMessages: protectedProcedure.query(({ ctx }) => {
    return settings.getMessages()
  }),
  getUserRole: protectedProcedure.query(({ ctx }) => {
    return settings.getUserRole(ctx.session.user.email || '');
  }),
  getTeachers: protectedProcedure.query(() => {
    return settings.getTeachers();
  }),
  createCommunications: protectedProcedure.input(z.array(z.object({
    subject: z.string(),
    message: z.string(),
    comment: z.string(),
    action_taken: z.string(),
    student: z.string(),
    timestamp: z.date()
  }))).mutation(async ({ input, ctx }) => {
    const teacherEmail = ctx.session.user.email;
    if (!teacherEmail) throw new Error('No email found in session');


    const role = await settings.getUserRole(ctx.session.user.email || '');

    if (!role.isTeacher) {
      throw new Error('User is not a teacher')
    }

    if (!role.isAdmin) {
      for (const item of input) {
        if (item.timestamp.valueOf() > Date.now() + 10 * 1000 * 60) throw new Error('Invalid timestamp')
        if (item.timestamp.valueOf() < Date.now() - 10 * 1000 * 60 * 60 * 24) throw new Error('Invalid timestamp')

        const subject = await settings.getSubject(item.subject)
        if (!subject) throw new Error('Invalid subject')
        if (subject.teachers.indexOf(teacherEmail) === -1) throw new Error('Invalid subject')
      }
    }


    let poolId: string | null = null

    if (input.length > 1) {
      const pool = await ctx.prisma.communicationsPool.create({
        data: {

        }
      })
      poolId = pool.id
    }

    return await ctx.prisma.$transaction(input.map(item => ctx.prisma.communication.create({
      data: {
        comment: item.comment,
        message: item.message,
        studentEnrolment: item.student,
        subjectCode: item.subject,
        timestamp: item.timestamp,
        teacherEmail: teacherEmail,
        action_taken: item.action_taken,
        poolId: poolId
      }
    })))
  }),
  getCommunications: protectedProcedure.input(z.object({
    mineOnly: z.boolean(),
    from: z.date().nullable(),
    to: z.date().nullable(),
    student: z.string().nullable(),
    subject: z.string().nullable(),
    teacher: z.string().nullable(),
    course: z.number().nullable(),
  }).optional()).query(async ({ ctx, input }) => {
    if (!ctx.session.user.email) throw new Error('No email found in session');
    const role = await settings.getUserRole(ctx.session.user.email || '');

    // Define start of this year in one line
    const startOfYear = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31, 0, 0, 0);

    const result = await ctx.prisma.communication.findMany({
      where: {
        teacherEmail: (!role.isAdmin || input?.mineOnly) ? ctx.session.user.email : (input?.teacher ? input.teacher : undefined),
        timestamp: {
          gte: input?.from || startOfYear,
          lte: input?.to || endOfYear,
        },
        studentEnrolment: input?.student || undefined,
        subjectCode: input?.subject || undefined,
      }
    })

    const result2 = (await Promise.all(result.map(async communication => ({
      ...communication,
      student: await settings.getStudentByEnrolment(communication.studentEnrolment),
      subject: await settings.getSubject(communication.subjectCode),
      teacher: await settings.getTeacher(communication.teacherEmail),
      color: (await settings.getMessages()).find(message => message.text === communication.message)?.sentiment.color || '#000000',
      isMine: communication.teacherEmail === ctx.session.user.email,
    })))).reverse();

    return result2.filter(communication => {
      if (input?.course) {
        return communication.subject?.courseYear === input.course;
      }
      return true;
    });
  }),
  getFile: protectedProcedure.input(z.string().regex(/^([a-zA-Z0-9\_\-]+\.)*[a-zA-Z0-9\_\-]+$/)).query(async ({ ctx, input }) => {
    if (!ctx.session.user.email) throw new Error('No email found in session');
    const role = await settings.getUserRole(ctx.session.user.email || '');

    if (!role.isAdmin) return ""

    return await settings.getFile(input);
  }),
  saveFile: protectedProcedure.input(z.object({
    filename: z.string().regex(/^([a-zA-Z0-9\_\-]+\.)*[a-zA-Z0-9\_\-]+$/),
    content: z.string(),
  })).mutation(async ({ ctx, input }) => {
    if (!ctx.session.user.email) throw new Error('No email found in session');
    const role = await settings.getUserRole(ctx.session.user.email || '');

    if (!role.isAdmin) return false

    await settings.saveFile(input.filename, input.content);
    await settings.importData();
  }),
  getCommunication: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    if (!ctx.session.user.email) throw new Error('No email found in session');
    const role = await settings.getUserRole(ctx.session.user.email || '');

    const result = await ctx.prisma.communication.findFirst({
      where: {
        id: input,
        teacherEmail: (!role.isAdmin) ? ctx.session.user.email : undefined,
      },
      include: {
        pool: {
          include: {
            communications: true
          }
        }
      }
    })

    if (!result) return null;

    return {
      ...result,
      student: await settings.getStudentByEnrolment(result.studentEnrolment),
      subject: await settings.getSubject(result.subjectCode),
      teacher: await settings.getTeacher(result.teacherEmail),
      color: (await settings.getMessages()).find(message => message.text === result.message)?.sentiment.color || '#000000',
      isMine: result.teacherEmail === ctx.session.user.email,
    };
  }),
  deleteCommunications: protectedProcedure.input(z.array(z.string())).mutation(async ({ ctx, input }) => {
    if (!ctx.session.user.email) throw new Error('No email found in session');
    const role = await settings.getUserRole(ctx.session.user.email || '');

    await ctx.prisma.communication.deleteMany({
      where: {
        id: {
          in: input
        },
        teacherEmail: (!role.isAdmin) ? ctx.session.user.email : undefined,
        createdAt: {
          gte: (!role.isAdmin) ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) : undefined
        }
      }
    })
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
