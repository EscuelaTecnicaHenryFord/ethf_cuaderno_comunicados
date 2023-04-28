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
  createCommunication: protectedProcedure.input(z.object({
    subject: z.string(),
    message: z.string(),
    comment: z.string(),
    student: z.string(),
    timestamp: z.date()
  })).mutation(async ({ input, ctx }) => {
    if (!ctx.session.user.email) throw new Error('No email found in session');

    return await ctx.prisma.communication.create({
      data: {
        comment: input.comment,
        message: input.message,
        studentEnrolment: input.student,
        subjectCode: input.subject,
        timestamp: input.timestamp,
        teacherEmail: ctx.session.user.email
      }
    })
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

    const result = await ctx.prisma.communication.findMany({
      where: {
        teacherEmail: (!role.isAdmin || input?.mineOnly) ? ctx.session.user.email : (input?.teacher ? input.teacher : undefined),
        timestamp: {
          gte: input?.from || undefined,
          lte: input?.to || undefined,
        },
        studentEnrolment: input?.student || undefined,
        subjectCode: input?.subject || undefined,
      }
    })

    const result2 = await Promise.all(result.map(async communication => ({
      ...communication,
      student: await settings.getStudentByEnrolment(communication.studentEnrolment),
      subject: await settings.getSubject(communication.subjectCode),
      teacher: await settings.getTeacher(communication.teacherEmail),
      isMine: communication.teacherEmail === ctx.session.user.email,
    })));

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
});

// export type definition of API
export type AppRouter = typeof appRouter;
