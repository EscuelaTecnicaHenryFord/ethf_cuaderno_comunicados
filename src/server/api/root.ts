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
  getStudentsOf: protectedProcedure.input(z.number()).query(({ input }) => {
    return settings.getStudentsOf(input);
  }),
  getSubjectsOfYear: protectedProcedure.input(z.number()).query(({ input }) => {
    return settings.getSubjectsOfYear(input);
  }),
  getStudent: protectedProcedure.input(z.string()).query(({ input }) => {
    return settings.getStudentByEnrolment(input);
  }),
  getMySubjects: protectedProcedure.query(({ ctx }) => {
    return settings.getSubjectsOf(ctx.session.user.email || '');
  }),
  getSubject: protectedProcedure.input(z.string()).query(({ input }) => {
    return settings.getSubject(input);
  }),
  getMessages: protectedProcedure.query(({ ctx }) => {
    return settings.getMessages()
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
  getMyCommunications: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) throw new Error('No email found in session');

    const result = await ctx.prisma.communication.findMany({
      where: {
        teacherEmail: ctx.session.user.email
      }
    })

    return Promise.all(result.map(async communication => ({
      ...communication,
      student: await settings.getStudentByEnrolment(communication.studentEnrolment),
      subject: await settings.getSubject(communication.subjectCode),
    })));
  })
});

// export type definition of API
export type AppRouter = typeof appRouter;
