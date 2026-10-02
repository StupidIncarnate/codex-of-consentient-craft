import { DatabaseSyncStub } from './database-sync.stub';

describe('DatabaseSyncStub', () => {
  it('VALID: {} => returns an in-memory database', () => {
    const db = DatabaseSyncStub();

    db.exec('CREATE TABLE items (id INTEGER PRIMARY KEY);');
    const insert = db.prepare('INSERT INTO items (id) VALUES (?);');
    insert.run(1);

    const query = db.prepare('SELECT id FROM items;');
    const rows = query.all();
    db.close();

    expect(rows.map((row) => ({ ...row }))).toStrictEqual([{ id: 1 }]);
  });
});
