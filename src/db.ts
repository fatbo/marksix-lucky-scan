import Dexie, { type Table } from 'dexie';
import type { TicketRecord } from './types';

class MarkSixDB extends Dexie {
  tickets!: Table<TicketRecord, number>;

  constructor() {
    super('MarkSixDB');
    this.version(1).stores({
      tickets: '++id, drawNumber, uploadDate',
    });
  }
}

export const db = new MarkSixDB();
