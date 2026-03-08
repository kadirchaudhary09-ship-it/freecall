import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type SignalData = string;
export type UserId = string;
export interface Signal {
    to: UserId;
    data: SignalData;
    from: UserId;
}
export type Time = bigint;
export interface RoomView {
    participants: Array<UserId>;
    code: RoomCode;
    createdAt: Time;
}
export type RoomCode = string;
export interface backendInterface {
    clearSignals(roomCode: RoomCode, userId: UserId): Promise<void>;
    createRoom(code: RoomCode): Promise<void>;
    getAllRooms(): Promise<Array<RoomView>>;
    getAllSignals(): Promise<Array<[[RoomCode, UserId], Array<Signal>]>>;
    getPendingSignals(roomCode: RoomCode, userId: UserId): Promise<Array<Signal>>;
    getRoomInfo(code: RoomCode): Promise<RoomView>;
    isParticipant(roomCode: RoomCode, userId: UserId): Promise<boolean>;
    joinRoom(code: RoomCode, userId: UserId): Promise<void>;
    leaveRoom(code: RoomCode, userId: UserId): Promise<void>;
    sendSignal(roomCode: RoomCode, from: UserId, to: UserId, data: SignalData): Promise<void>;
}
