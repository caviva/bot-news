const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')

const { EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock');
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('1403def6a6064d06959ae61f6d682644');

let news = [];
let iconNumber = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

const exitFlow = addKeyword('#')
    .addAnswer("Nos vemos en una próxima oportunidad 👋");

const finalFlow = addKeyword('final')
    .addAnswer("Si quieres ver más noticias digita *0*, de lo contrario digita *#* para salir", {
        capture: true
    }, async (context, { gotoFlow }) => {
        try {
            if (context.body == "#") {
                return gotoFlow(exitFlow);
            }
            else {
                return gotoFlow(mainFlow);
            }
        } catch (error) {
            console.error(error);
        }
    });

const questionFlow = addKeyword('pregunta')
    .addAnswer('¿Qué noticia quieres conocer?', {
        capture: true
    }, async (context, { fallBack, flowDynamic, gotoFlow }) => {
        try {
            if (!['1', '2', '3', '4', '5'].includes(context.body)) {
                return fallBack("Debes escribir el número de la noticia que quieres conocer");
            }
            else {
                await flowDynamic("*" + news[context.body - 1].title + "*");
                await flowDynamic(news[context.body - 1].url);
                return gotoFlow(finalFlow);
            }
        } catch (error) {
            console.error(error);
        }
    }, [finalFlow]);

const menuFlow = addKeyword('0')
    .addAnswer('Preparando las últimas noticias...', null, async (context, { flowDynamic, gotoFlow }) => {
        try {
            newsapi.v2.topHeadlines({
                country: 'co'
            }).then(async response => {
                news = response.articles;
                let i = 1;
                for (let n of news) {
                    if (i <= 5) {
                        await flowDynamic(iconNumber[i-1] +" "+ n.title);
                    }
                    else {
                        break;
                    }
                    i++;
                }
                return gotoFlow(questionFlow);
            });
        } catch (error) {
            console.error(error);
        }
    }, [questionFlow, finalFlow]);

const categoryFlow = addKeyword('categoría')
    .addAnswer(['1️⃣ Política 📰', '2️⃣ Salud 🩺', '3️⃣ Economía 💰', '4️⃣ Entretenimiento 🎭', '5️⃣ Deportes 🏅'], {
        capture: true
    }, async (context, { fallBack, gotoFlow }) => {
        try {
            if (!['1', '2', '3', '4', '5'].includes(context.body)) {
                return fallBack("Debes escribir el número de la categoría");
            }
            else {
                if (context.body == '1') {
                    cat = 'Política';
                }
                if (context.body == '2') {
                    cat = 'Salud';
                }
                if (context.body == '3') {
                    cat = 'Economía';
                }
                if (context.body == '4') {
                    cat = 'Entretenimiento';
                }
                if (context.body == '5') {
                    cat = 'Deportes';
                }
                return gotoFlow(menuFlow);
            }
        } catch (error) {
            console.error(error);
        }
    }, [menuFlow, finalFlow]);

const mainFlow = addKeyword(EVENTS.WELCOME)
    .addAnswer('Hola 👋, este es el Bot de Noticias de Lumo 📰 🤖', {
        delay: 0
    }, async (context, { state, flowDynamic, gotoFlow }) => {
        try {
            state.clear();
            await state.update({ name: context.pushName });
            state.get('name');
            await flowDynamic('¡*' + state.get('name') + '*!, ¿qué número de categoría te gustaría conocer?');
            return gotoFlow(categoryFlow);
        } catch (error) {
            console.error(error);
        }
    }, [categoryFlow, questionFlow, finalFlow, menuFlow]);

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([mainFlow])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
