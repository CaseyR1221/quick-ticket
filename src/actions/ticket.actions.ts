'use server';

import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';
import { logEvent } from '@/utils/sentry';

// Create New Ticket
export async function createTicket(
  prevSate: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as string;

    if (!subject || !description || !priority) {
      logEvent(
        'Missing required fields',
        'ticket',
        {
          subject,
          description,
          priority,
        },
        'warning'
      );

      return {
        success: false,
        message: 'Subject, description, and priority are all required fields.',
      };
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority,
      },
    });

    logEvent(
      `Ticket created successfully: Ticket: ${ticket.id}`,
      'ticket',
      {
        Ticket: ticket.id,
      },
      'info'
    );

    // Revalidate the path to refresh the tickets list
    revalidatePath('/tickets');

    return {
      success: true,
      message: 'Ticket created successfully!',
    };
  } catch (error) {
    logEvent(
      'An error occurred while creating the ticket.',
      'ticket',
      { formData: Object.fromEntries(formData.entries()) },
      'error',
      error
    );

    return {
      success: false,
      message: 'An error occurred while creating the ticket.',
    };
  }
}

// Get all user tickets
export async function getTickets() {
  try {
    // const user = await getCurrentUser();

    // if (!user) {
    //   logEvent('Unauthorized access to ticket list', 'ticket', {}, 'warning');
    //   return [];
    // }

    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    logEvent(
      'Fetched ticket list',
      'ticket',
      { count: tickets.length },
      'info'
    );

    return tickets;
  } catch (error) {
    logEvent('Error fetching tickets', 'ticket', {}, 'error', error);

    return [];
  }
}

// Get single ticket details
export async function getTicketById(id: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
    });

    if (!ticket) {
      logEvent('Ticket not found', 'ticket', { ticketId: id }, 'warning');
    }

    return ticket;
  } catch (error) {
    logEvent(
      'Error fetching ticket details',
      'ticket',
      { ticketId: id },
      'error',
      error
    );
    return null;
  }
}