import dayjs from 'dayjs';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from './lib/prisma';

export async function appRoutes(app: FastifyInstance) {


  app.get('/habits', async () => {
    const habits = await prisma.habit.findMany()
    return habits
  })

  app.post('/habits', async (request) => {

    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6))
    })

    const { title, weekDays } = createHabitBody.parse(request.body)

    //create date with zeros in the hour
    const today = dayjs().startOf('day').toDate()

    const habits = await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map(weekDay => {
            return {
              week_day: weekDay,
            }
          })
        }
      }
    })
    return habits
  })

  app.get('/habits/day', async (request) => {
    const getDayParams = z.object({
      date: z.coerce.date()
    })

    const { date } = getDayParams.parse(request.query)

    const parseDate = dayjs(date).startOf('day')
    const weekDay = parseDate.get('day')

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date
        },
        weekDays: {
          some: {
            week_day: weekDay
          }
        }
      }
    })

    const day = await prisma.day.findUnique({
      where: {
        date: parseDate.toDate()
      },
      include: {
        dayHabits: true,
      }
    })

    const completedHabits = day?.dayHabits.map(dayHabit => {
      return dayHabit.habit_id
    })

    return { possibleHabits, completedHabits }
  })

  app.patch('/habits/:id/toogle', async (request) => {
    const toggleHabitParams = z.object({
      id: z.string().uuid()
    })

    const { id } = toggleHabitParams.parse(request.params)

    const today = dayjs().startOf('day').toDate()

    let day = await prisma.day.findUnique({
      where: { date: today }
    })

    if (!day) {
      day = await prisma.day.create({ data: { date: today } })
    }

    const dayHabit = await prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: { day_id: day.id, habit_id: id }
      }
    })

    //toogle complete habit
    if (dayHabit) {
      //unset complete habit
      await prisma.dayHabit.delete({
        where: { id: dayHabit.id }

      })
      console.log('Não Completou a tarefa!')
    } else {
      //set complete habit
      await prisma.dayHabit.create({
        data: { day_id: day.id, habit_id: id }
      })
      console.log('Completou a tarefa!')
    }

  })
}