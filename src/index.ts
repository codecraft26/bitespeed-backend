// src/index.ts
import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from './data-source';
import { Contact } from './entity/Contact';

const app = express();
app.use(express.json());

AppDataSource.initialize().then(() => {
  console.log('Data Source has been initialized!');
}).catch((err) => {
  console.error('Error during Data Source initialization:', err);
});

app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body;
  
    const contactRepository = AppDataSource.getRepository(Contact);
    let contacts: Contact[] = [];
  
    if (email) {
      contacts = await contactRepository.find({ where: { email } });
    }
  
    if (phoneNumber) {
      const phoneContacts = await contactRepository.find({ where: { phoneNumber } });
      // Merge contacts from email and phone, ensuring no duplicates
      contacts = [...new Map([...contacts, ...phoneContacts].map(contact => [contact.id, contact])).values()];
    }
  
    let primaryContact: Contact | null = null;
  
    if (contacts.length > 0) {
      // Find the oldest contact to be the primary contact
      primaryContact = contacts.reduce((oldest, contact) => 
        !oldest || contact.createdAt < oldest.createdAt ? contact : oldest
      );
  
      // Ensure all contacts are linked to the primary contact
      for (const contact of contacts) {
        if (contact.id !== primaryContact.id && contact.linkedId !== primaryContact.id) {
          contact.linkedId = primaryContact.id;
          contact.linkPrecedence = 'secondary';
          await contactRepository.save(contact);
        }
      }
    } else {
      // Create a new primary contact if no existing contact found
      primaryContact = new Contact();
      primaryContact.email = email;
      primaryContact.phoneNumber = phoneNumber;
      primaryContact.linkPrecedence = 'primary';
      await contactRepository.save(primaryContact);
    }
  
    // Re-fetch all linked contacts to ensure they are correctly updated
    if (primaryContact) {
      contacts = await contactRepository.find({ where: [{ linkedId: primaryContact.id }, { id: primaryContact.id }] });
    }
  
    const secondaryContacts = contacts.filter(contact => contact.id !== primaryContact!.id);
  
    const emails = [...new Set([primaryContact!.email, ...secondaryContacts.map(contact => contact.email)].filter(Boolean))];
    const phoneNumbers = [...new Set([primaryContact!.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber)].filter(Boolean))];
    const secondaryContactIds = secondaryContacts.map(contact => contact.id);
  
    res.status(200).json({
      contact: {
        primaryContatctId: primaryContact!.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });
  });
  
  
app.get('/healthcheck', async (req, res) => {



    res.status(200).json({
        status: 'ok',
        message:"server is running"
        
    });
});



app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
