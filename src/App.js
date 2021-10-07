import { useState, useEffect } from 'react';
import { withAuthenticator } from 'aws-amplify-react';
import { API, graphqlOperation } from 'aws-amplify';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
} from './graphql/subscriptions';

function App() {
  const [id, setId] = useState('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    getNotes();
    API.graphql(graphqlOperation(onCreateNote)).subscribe({
      next: (noteData) => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = notes.filter((note) => note.id !== newNote.id);
        const updatedNotes = [...prevNotes, newNote];
        setNotes(updatedNotes);
        getNotes();
      },
    });

    API.graphql(graphqlOperation(onDeleteNote)).subscribe({
      next: (noteData) => {
        const deletedNote = noteData.value.data.deleteNote;
        const updatedNotes = notes.filter((note) => note.id !== deletedNote.id);
        setNotes(updatedNotes);
        getNotes();
      },
    });

    API.graphql(graphqlOperation(onUpdateNote)).subscribe({
      next: (noteData) => {
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = notes.findIndex((note) => note.id === updatedNote.id);
        const updatedNotes = [
          ...notes.slice(0, index),
          updatedNote,
          ...notes.slice(index + 1),
        ];

        setNotes(updatedNotes);
        setNote('');
        setId('');
        getNotes();
      },
    });
  }, []);

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  };

  const handleChangeNote = (event) => {
    setNote(event.target.value);
  };

  const hasExistingNote = () => {
    if (id) {
      //is the id a valid id
      const isNote = notes.findIndex((note) => note.id === id) > -1;
      return isNote;
    }
    return false;
  };

  const handleAddNote = async (event) => {
    event.preventDefault();

    //check if we have an exisiting note, if so update it.
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      const input = {
        note: note,
      };
      await API.graphql(graphqlOperation(createNote, { input }));
      // const newNote = result.data.createNote;
      // const updatedNotes = [newNote, ...notes];
      // setNotes(updatedNotes);
      setNote('');
    }
  };

  const handleUpdateNote = async () => {
    const input = {
      id,
      note,
    };

    await API.graphql(graphqlOperation(updateNote, { input }));
    // const updatedNote = result.data.updateNote;
    // const index = notes.findIndex((note) => note.id === updatedNote.id);
    // const updatedNotes = [
    //   ...notes.slice(0, index),
    //   updatedNote,
    //   ...notes.slice(index + 1),
    // ];

    // setNotes(updatedNotes);
    // setNote('');
    // setId('');
  };

  const handleDeleteNote = async (noteId) => {
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
    // const deletedNoteId = result.data.deleteNote.id;
    // const updatedNotes = notes.filter((note) => note.id !== deletedNoteId);
    // setNotes(updatedNotes);
  };

  const handleSetNote = (item) => {
    setNote(item.note);
    setId(item.id);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-1">Amplify Notetaker</h1>
      <form onSubmit={handleAddNote} className="mb-3">
        <input
          type="text"
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note}
        />
        <button className="pa2 f4" type="submit">
          {' '}
          {id ? 'Update Note' : 'Add Note'}
        </button>
      </form>

      {/* Notes List */}
      <div>
        {notes.map((item) => (
          <div key={item.id} className="flex items-center">
            <li onClick={() => handleSetNote(item)} className="list pa1 f3">
              {' '}
              {item.note}
            </li>
            <button
              onClick={() => handleDeleteNote(item.id)}
              className="bg-transparent bn f4"
            >
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
