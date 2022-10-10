import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fileUpload from 'express-fileupload';
import logger from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Container, Service } from 'typedi';
import { DictionaryService } from './services/dictionary.service';

@Service()
export class Application {
    app: express.Application;
    // private readonly internalError: number = StatusCodes.INTERNAL_SERVER_ERROR;
    dicService: DictionaryService;
    private readonly swaggerOptions: swaggerJSDoc.Options;

    constructor() {
        this.app = express();
        this.dicService = Container.get(DictionaryService);

        this.swaggerOptions = {
            swaggerDefinition: {
                openapi: '3.0.0',
                info: {
                    title: 'Cadriciel Serveur',
                    version: '1.0.0',
                },
            },
            apis: ['**/*.ts'],
        };

        this.config();

        this.bindRoutes();
    }

    bindRoutes(): void {
        this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(this.swaggerOptions)));
        this.app.use('/admin/dictionary', this.dicService.router);
    }

    private config(): void {
        // Middlewares configuration
        this.app.use(logger('dev'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(fileUpload());
        this.app.use(cors());
    }
}
