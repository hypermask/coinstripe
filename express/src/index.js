import 'now-env'
import express from 'express'
import 'express-async-errors'
import bodyParser from 'body-parser'
import logger from 'morgan'
import path from 'path'
import chalk from 'chalk'
import errorHandler from 'errorhandler'

const app = express();

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, '../static')));

app.disable('x-powered-by');

if (process.env.NODE_ENV !== 'production') {
    app.use(errorHandler());
} else {
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send('Server Error');
    });
}


app.get('/widget', async (req, res) => {
    res.render('widget', {
        title: 'wumbo'
    })
})

app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);

app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});
