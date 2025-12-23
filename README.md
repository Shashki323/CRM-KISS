# CRM-KISS
Это обычный readme файл, если кому то интересно как это работает, то можете почитать про язык разметки markdown.




Информация по запуску сервера с работающей базой данных:

1) Устанавливаем с официального сайта Node-js (там все расписано как и что установить на свою операционку) СОВЕТУЮ запустить ВПН https://nodejs.org


2) После установки переходим в папку с нашим GIT-проектом
У меня это: 

cd /CRM/CRM-KISS/backend

3) Устанавливаем зависимости 

npm install

4) Запускаем сервер

npm start

После запуска должны увидеть данное сообщение:

        JSON Server started on PORT :3000
        Press CTRL-C to stop
        Watching db.json...

        (˶ᵔ ᵕ ᵔ˶)   

        Index:
        http://localhost:3000/

        Static files:
        Serving ./public directory if it exists

        Endpoints:
        http://localhost:3000/clients
        http://localhost:3000/deals

4.1) Запускаем сервер на Windows

Вместо "npm start" можно использовать

npm run start


ОБЯЗАТЕЛЬНО ПРОВЕРИТЬ: 

1) Убедится что порт 3000 свободен
2) Файл db.json сущетствует в папке backend
 