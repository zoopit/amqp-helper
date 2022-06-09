import { Connection } from "amqplib" 

export function connect(uri: string): Promise<Connection>;

export function sendWithResponseQueue<T,R>(connection: Connection , queueOut: string , queueIn: string , body: T): Promise<R>;

export type Connection = Connection