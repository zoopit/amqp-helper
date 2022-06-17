import { Connection as Connection1 } from "amqplib" 

export function connect(uri: string): Promise<Connection1>;

export function sendWithResponseQueue<T,R>(connection: Connection1 , queueOut: string , queueIn: string , body: T): Promise<R>;

export type Connection = Connection1