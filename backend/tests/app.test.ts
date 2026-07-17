import type { Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "4100";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/medflow-test";
process.env.JWT_SECRET = "test-jwt-secret-with-enough-length";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.ADMIN_URL = "http://localhost:5174";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "Password123";
process.env.CLOUDINARY_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_SECRET_KEY = "test-secret";
process.env.RAZORPAY_KEY_ID = "rzp_test";
process.env.RAZORPAY_KEY_SECRET = "rzp_secret";
process.env.STRIPE_SECRET_KEY = "sk_test_secret";
process.env.CURRENCY = "INR";

const fakeDb = vi.hoisted(() => {
  type RecordData = Record<string, any> & { _id: string };
  type QueryFilter = Record<string, any>;

  const ids = {
    user: "000000000000000000000001",
    otherUser: "000000000000000000000002",
    appointment: "000000000000000000000003",
    doctor: "000000000000000000000004"
  };

  let counter = 10;
  const users = new Map<string, RecordData>();
  const doctors = new Map<string, RecordData>();
  const appointments = new Map<string, RecordData>();

  const makeId = () => counter.toString(16).padStart(24, "0");

  class FakeDocument {
    [key: string]: any;

    public constructor(data: Record<string, any>) {
      Object.assign(this, data);
      this._id ??= makeId();
      counter += 1;
    }

    public toObject(): Record<string, any> {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(this)) {
        if (typeof value !== "function") {
          result[key] = value;
        }
      }
      return result;
    }
  }

  const stripSelectedFields = (value: any, select?: string): any => {
    if (!select || !value) {
      return value;
    }

    const stripOne = (item: any) => {
      const clone = item instanceof FakeDocument ? new FakeDocument(item.toObject()) : { ...item };
      for (const field of select.split(/\s+/)) {
        if (field.startsWith("-")) {
          delete clone[field.slice(1)];
        }
      }
      return clone;
    };

    return Array.isArray(value) ? value.map(stripOne) : stripOne(value);
  };

  const sortByDateDesc = (value: any): any => {
    if (!Array.isArray(value)) {
      return value;
    }

    return [...value].sort((a, b) => Number(b.date ?? 0) - Number(a.date ?? 0));
  };

  const query = (value: any) => ({
    select: (select: string) => Promise.resolve(stripSelectedFields(value, select)),
    sort: () => Promise.resolve(sortByDateDesc(value)),
    then: (resolve: (value: any) => unknown, reject: (reason?: any) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
    catch: (reject: (reason?: any) => unknown) => Promise.resolve(value).catch(reject)
  });

  const matches = (doc: RecordData, filter: QueryFilter) =>
    Object.entries(filter).every(([key, value]) => doc[key] === value);

  class UserModel extends FakeDocument {
    public async save() {
      if ([...users.values()].some((user) => user.email === this.email)) {
        const error = new Error("duplicate key") as Error & {
          code: number;
          keyValue: Record<string, unknown>;
        };
        error.code = 11000;
        error.keyValue = { email: this.email };
        throw error;
      }

      users.set(this._id, this as RecordData);
      return this;
    }

    public static findOne(filter: QueryFilter) {
      return Promise.resolve([...users.values()].find((user) => matches(user, filter)) ?? null);
    }

    public static findById(id: string) {
      return query(users.get(id) ?? null);
    }

    public static findByIdAndUpdate(id: string, update: QueryFilter) {
      const doc = users.get(id);
      if (doc) {
        Object.assign(doc, update);
      }
      return Promise.resolve(doc ?? null);
    }

    public static find(filter: QueryFilter = {}) {
      return query([...users.values()].filter((user) => matches(user, filter)));
    }
  }

  class DoctorModel extends FakeDocument {
    public async save() {
      doctors.set(this._id, this as RecordData);
      return this;
    }

    public static findOne(filter: QueryFilter) {
      return Promise.resolve(
        [...doctors.values()].find((doctor) => matches(doctor, filter)) ?? null
      );
    }

    public static findById(id: string) {
      return query(doctors.get(id) ?? null);
    }

    public static findByIdAndUpdate(id: string, update: QueryFilter) {
      const doc = doctors.get(id);
      if (doc) {
        Object.assign(doc, update);
      }
      return Promise.resolve(doc ?? null);
    }

    public static find(filter: QueryFilter = {}) {
      return query([...doctors.values()].filter((doctor) => matches(doctor, filter)));
    }
  }

  class AppointmentModel extends FakeDocument {
    public async save() {
      appointments.set(this._id, this as RecordData);
      return this;
    }

    public static findById(id: string) {
      return query(appointments.get(id) ?? null);
    }

    public static findByIdAndUpdate(id: string, update: QueryFilter) {
      const doc = appointments.get(id);
      if (doc) {
        Object.assign(doc, update);
      }
      return Promise.resolve(doc ?? null);
    }

    public static find(filter: QueryFilter = {}) {
      return query(
        [...appointments.values()].filter((appointment) => matches(appointment, filter))
      );
    }
  }

  const reset = () => {
    users.clear();
    doctors.clear();
    appointments.clear();
    counter = 10;

    users.set(
      ids.user,
      new FakeDocument({
        _id: ids.user,
        name: "Patient One",
        email: "patient@example.com",
        password: "hashed",
        image: "image",
        phone: "1234567890",
        address: { line1: "Line 1", line2: "Line 2" },
        gender: "Male",
        dob: "2000-01-01"
      }) as RecordData
    );

    users.set(
      ids.otherUser,
      new FakeDocument({
        _id: ids.otherUser,
        name: "Patient Two",
        email: "other@example.com",
        password: "hashed",
        image: "image",
        phone: "1234567890",
        address: { line1: "Line 1", line2: "Line 2" },
        gender: "Female",
        dob: "2000-01-01"
      }) as RecordData
    );

    doctors.set(
      ids.doctor,
      new FakeDocument({
        _id: ids.doctor,
        name: "Doctor One",
        email: "doctor@example.com",
        password: "hashed",
        image: "image",
        speciality: "General physician",
        degree: "MBBS",
        experience: "5 Years",
        about: "About",
        available: true,
        fees: 500,
        slots_booked: {},
        address: { line1: "Clinic", line2: "City" },
        date: Date.now()
      }) as RecordData
    );

    appointments.set(
      ids.appointment,
      new FakeDocument({
        _id: ids.appointment,
        userId: ids.otherUser,
        docId: ids.doctor,
        slotDate: "17_7_2026",
        slotTime: "10:00 AM",
        userData: {},
        docData: {},
        amount: 500,
        date: Date.now(),
        cancelled: false,
        payment: false,
        isCompleted: false
      }) as RecordData
    );
  };

  return { ids, reset, users, appointments, UserModel, DoctorModel, AppointmentModel };
});

vi.mock("../src/models/User.js", () => ({ default: fakeDb.UserModel }));
vi.mock("../src/models/Doctor.js", () => ({ default: fakeDb.DoctorModel }));
vi.mock("../src/models/Appointment.js", () => ({ default: fakeDb.AppointmentModel }));
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
    compare: vi.fn(async () => true)
  }
}));

describe("MedFlow backend foundation", () => {
  let app: Express;

  const tokenFor = (id: string) =>
    jwt.sign({ id, role: "patient" }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

  beforeAll(async () => {
    app = (await import("../src/app.js")).default;
  });

  beforeEach(() => {
    fakeDb.reset();
  });

  it("returns health status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("returns readiness status without opening a real database connection", async () => {
    const response = await request(app).get("/ready").expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.data.database).toBe("disconnected");
  });

  it("rejects invalid registration input", async () => {
    const response = await request(app)
      .post("/api/user/register")
      .send({ name: "A", email: "bad-email", password: "short" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });

  it("rejects invalid login input", async () => {
    const response = await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com" })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it("handles duplicate patient emails", async () => {
    const response = await request(app)
      .post("/api/user/register")
      .send({
        name: "Patient One",
        email: "patient@example.com",
        password: "Password123"
      })
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("email");
  });

  it("rejects missing authentication tokens", async () => {
    const response = await request(app).get("/api/user/get-profile").expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Not Authorized Login Again");
  });

  it("rejects invalid authentication tokens", async () => {
    const response = await request(app)
      .get("/api/user/get-profile")
      .set("token", "not-a-real-token")
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it("allows protected route access with a valid legacy token header", async () => {
    const response = await request(app)
      .get("/api/user/get-profile")
      .set("token", tokenFor(fakeDb.ids.user))
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.userData.email).toBe("patient@example.com");
    expect(response.body.userData.password).toBeUndefined();
  });

  it("rejects invalid ObjectIds safely", async () => {
    const response = await request(app)
      .post("/api/user/book-appointment")
      .set("Authorization", `Bearer ${tokenFor(fakeDb.ids.user)}`)
      .send({ docId: "bad-id", slotDate: "17_7_2026", slotTime: "10:00 AM" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
  });

  it("enforces appointment ownership", async () => {
    const response = await request(app)
      .post("/api/user/cancel-appointment")
      .set("token", tokenFor(fakeDb.ids.user))
      .send({ appointmentId: fakeDb.ids.appointment })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Unauthorized action");
    expect(fakeDb.appointments.get(fakeDb.ids.appointment)?.cancelled).toBe(false);
  });

  it("enforces payment ownership before initializing external payment", async () => {
    const response = await request(app)
      .post("/api/user/payment-razorpay")
      .set("token", tokenFor(fakeDb.ids.user))
      .send({ appointmentId: fakeDb.ids.appointment })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Unauthorized action");
  });

  it("returns a consistent 404 response", async () => {
    const response = await request(app).get("/api/nope").expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Route not found");
  });

  it("returns a global error response for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/user/login")
      .set("Content-Type", "application/json")
      .send('{"email":')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Malformed JSON request body");
  });
});
