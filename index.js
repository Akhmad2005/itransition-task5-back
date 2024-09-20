// server.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { ru, ru_RU, de, fakerDE_AT, de_CH, fakerDE_CH, de_AT, en, en_GB, Faker, fa } = require('@faker-js/faker');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cors = require('cors');


const faker = {
	en: new Faker({
		locale: [en_GB, en],
	}),
	ru: new Faker({
		locale: [ru_RU, ru],
	}),
	de: new Faker({
		locale: [de_AT, de, fakerDE_AT, de_CH, fakerDE_CH],
	}),
}

const app = express();
app.use(cors())
const PORT = 7777;

// Генерация случайного ФИО в зависимости от региона
const generateFullName = (region) => {
	return faker[region].person.fullName()
};

// Генерация случайного адреса в зависимости от региона
const generateAddress = (region) => {
  if (region === 'en') {
    return `${faker.en.location.buildingNumber()}, ${faker.en.location.streetAddress()}, ${faker.en.location.city()}, ${faker.en.location.county()}, ${faker.en.location.zipCode()}`;
  } else if (region === 'ru') {
    return `${faker.ru.location.country()}, ${faker.ru.location.city()}, ${faker.ru.location.street()}, ${faker.ru.location.buildingNumber()}`;
  } else if (region === 'de') {
    return `${faker.de.location.streetAddress()}, ${faker.de.location.buildingNumber()}, ${faker.de.location.city()}`;
  }
	
};

// Генерация случайного телефона в зависимости от региона
const generatePhoneNumber = (region) => {
	return faker[region].phone.number();
};

// Применение ошибок к строкам
const introduceErrors = (str, errorCount, region) => {
  let result = str.split('');
  const errorTypes = ['delete', 'insert', 'swap'];
  for (let i = 0; i < Math.floor(errorCount); i++) {
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
		
    const index = Math.floor(Math.random() * result.length);

    if (errorType === 'delete' && result.length > 1) {
      result.splice(index, 1); // Удаление символа
    } else if (errorType === 'insert') {
      const randomChar = faker[region].string.alpha(1); // Вставка символа
      result.splice(index, 0, randomChar);
    } else if (errorType === 'swap' && index < result.length - 1) {
      [result[index], result[index + 1]] = [result[index + 1], result[index]]; // Перестановка символов
    }
  }

  // Возможность добавления дробной ошибки
  if (Math.random() < (errorCount % 1)) {
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    const index = Math.floor(Math.random() * result.length);
		
    if (errorType === 'delete' && result.length > 1) {
      result.splice(index, 1);
    } else if (errorType === 'insert') {
      const randomChar = faker[region].string.alpha(1);
      result.splice(index, 0, randomChar);
    } else if (errorType === 'swap' && index < result.length - 1) {
      [result[index], result[index + 1]] = [result[index + 1], result[index]];
    }
  }

  return result.join('');
};

// Генерация данных для одной записи
const generateRecord = (region, errorCount, index) => {
  const fullName = introduceErrors(generateFullName(region), errorCount, region);
  const address = introduceErrors(generateAddress(region), errorCount, region);
  const phoneNumber = introduceErrors(generatePhoneNumber(region), errorCount, region);
	
  return {
    number: index + 1,
    id: uuidv4(),
    fullName,
    address,
    phoneNumber,
  };
};

// Эндпоинт для генерации данных
app.get('/generate', (req, res) => {
  const { region = 'en', seed = '', errors = 0, page = 1, limit = 20 } = req.query;
	
  // Установить seed для генератора случайных чисел
  faker[region].seed(Number(seed) + Number(page));

  const data = [];
  for (let i = 0; i < limit; i++) {
    const record = generateRecord(region, Number(errors), (page - 1) * limit + i);
    data.push(record);
  }
  res.json(data);
});

// Эндпоинт для экспорта в CSV
app.get('/export', (req, res) => {
  const { region = 'en', seed = '123', errors = 0, page = 1, limit = 20 } = req.query;

  // Установить seed для генератора случайных чисел
  faker[region].seed(Number(seed) + Number(page));

  const data = [];
  for (let i = 0; i < limit; i++) {
    const record = generateRecord(region, Number(errors), (page - 1) * limit + i);
    data.push(record);
  }

  // Генерация CSV
  const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
      { id: 'number', title: 'Number' },
      { id: 'id', title: 'ID' },
      { id: 'fullName', title: 'Full Name' },
      { id: 'address', title: 'Address' },
      { id: 'phoneNumber', title: 'Phone Number' },
    ],
	});

  csvWriter.writeRecords(data)
	.then(() => {
    res.download('data.csv');
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
