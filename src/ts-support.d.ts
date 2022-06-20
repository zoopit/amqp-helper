import type * as AMQP from "amqplib" 

// Just declaration file for ts-support.js


export function connect(uri: string): Promise<AMQP.Connection>;

export function sendWithResponseQueue<T,R>(connection: AMQP.Connection , queueOut: string , queueIn: string , body: T): Promise<R>;

export type Connection = AMQP.Connection