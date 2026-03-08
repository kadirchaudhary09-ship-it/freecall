import List "mo:core/List";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Order "mo:core/Order";

actor {
  type UserId = Text;
  type RoomCode = Text;
  type SignalData = Text;

  type Room = {
    code : RoomCode;
    participants : Set.Set<UserId>;
    createdAt : Time.Time;
  };

  type RoomView = {
    code : RoomCode;
    participants : [UserId];
    createdAt : Time.Time;
  };

  type Signal = {
    from : UserId;
    to : UserId;
    data : SignalData;
  };

  // Define a module to compare (RoomCode, UserId) tuples
  module RoomCodeUserId {
    public func compare(a : (RoomCode, UserId), b : (RoomCode, UserId)) : Order.Order {
      switch (Text.compare(a.0, b.0)) {
        case (#equal) { Text.compare(a.1, b.1) };
        case (order) { order };
      };
    };
  };

  let rooms = Map.empty<RoomCode, Room>();
  let signals = Map.empty<(RoomCode, UserId), List.List<Signal>>();

  // Room management
  public shared ({ caller }) func createRoom(code : RoomCode) : async () {
    if (rooms.containsKey(code)) { Runtime.trap("Room already exists") };

    let newRoom : Room = {
      code;
      participants = Set.empty<UserId>();
      createdAt = Time.now();
    };

    rooms.add(code, newRoom);
  };

  public shared ({ caller }) func joinRoom(code : RoomCode, userId : UserId) : async () {
    switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) {
        if (room.participants.contains(userId)) { Runtime.trap("User already joined the room") };
        room.participants.add(userId);
        rooms.add(code, room);
      };
    };
  };

  public shared ({ caller }) func leaveRoom(code : RoomCode, userId : UserId) : async () {
    switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) {
        if (not room.participants.contains(userId)) { Runtime.trap("User is not a participant in this room") };
        room.participants.remove(userId);
        rooms.add(code, room);
      };
    };
  };

  // Check if a participant is in a room
  public query ({ caller }) func isParticipant(roomCode : RoomCode, userId : UserId) : async Bool {
    switch (rooms.get(roomCode)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) { room.participants.contains(userId) };
    };
  };

  public query ({ caller }) func getRoomInfo(code : RoomCode) : async RoomView {
    switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) {
        {
          code = room.code;
          participants = room.participants.toArray();
          createdAt = room.createdAt;
        };
      };
    };
  };

  public query ({ caller }) func getAllRooms() : async [RoomView] {
    rooms.values().toArray().map(func(room) { { room with participants = room.participants.toArray() } });
  };

  // Signaling functions
  public shared ({ caller }) func sendSignal(roomCode : RoomCode, from : UserId, to : UserId, data : SignalData) : async () {
    switch (rooms.get(roomCode)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) {
        if (not room.participants.contains(to)) { Runtime.trap("Target user is not a participant in this room") };
        let signal : Signal = { from; to; data };
        let key = (roomCode, to);

        let currentSignals = switch (signals.get(key)) {
          case (null) { List.empty<Signal>() };
          case (?list) { list };
        };

        currentSignals.add(signal);
        signals.add(key, currentSignals);
      };
    };
  };

  public query ({ caller }) func getPendingSignals(roomCode : RoomCode, userId : UserId) : async [Signal] {
    switch (signals.get((roomCode, userId))) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  public shared ({ caller }) func clearSignals(roomCode : RoomCode, userId : UserId) : async () {
    signals.remove((roomCode, userId));
  };

  public query ({ caller }) func getAllSignals() : async [((RoomCode, UserId), [Signal])] {
    signals.entries().toArray().map(func((key, list)) { (key, list.toArray()) });
  };
};
