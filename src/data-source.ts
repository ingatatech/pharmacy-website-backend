import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./entities/User";
import { Category } from "./entities/Category";
import { Service } from "./entities/Service";
import { Product } from "./entities/Product";
import { Article } from "./entities/Article";
import { Faq } from "./entities/Faq";
import { PharmacyLocation } from "./entities/PharmacyLocation";
import { ContactInquiry } from "./entities/ContactInquiry";
import { RefillRequest } from "./entities/RefillRequest";
import { SiteSetting } from "./entities/SiteSetting";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV !== "production",
  logging: false,
  entities: [
    User,
    Category,
    Service,
    Product,
    Article,
    Faq,
    PharmacyLocation,
    ContactInquiry,
    RefillRequest,
    SiteSetting,
  ],
  migrations: [],
  subscribers: [],
});
