import type { Express } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "4100";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/medflow-test";
process.env.JWT_SECRET = "test-jwt-secret-with-enough-length";
process.env.JWT_ACCESS_SECRET = "test-access-secret-with-enough-length";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-enough-length";
process.env.ACCESS_TOKEN_EXPIRES_IN = "15m";
process.env.REFRESH_TOKEN_EXPIRES_IN = "30d";
process.env.JWT_ISSUER = "medflow-ai-test";
process.env.JWT_AUDIENCE = "medflow-ai-test-clients";
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
process.env.EMAIL_FROM = "MedFlow AI <no-reply@example.test>";
process.env.OTP_MAX_ATTEMPTS = "3";
process.env.AUTH_LOCK_MAX_ATTEMPTS = "3";
process.env.AUTH_LOCK_DURATION = "1s";

const fakeDb = vi.hoisted(() => {
  type RecordData = Record<string, any> & { _id: string };
  type QueryFilter = Record<string, any>;

  const ids = {
    user: "000000000000000000000001",
    otherUser: "000000000000000000000002",
    unverifiedUser: "000000000000000000000005",
    suspendedUser: "000000000000000000000006",
    appointment: "000000000000000000000003",
    doctor: "000000000000000000000004"
  };

  let counter = 10;
  const users = new Map<string, RecordData>();
  const doctors = new Map<string, RecordData>();
  const appointments = new Map<string, RecordData>();
  const sessions = new Map<string, RecordData>();
  const challenges = new Map<string, RecordData>();

  const makeId = () => counter.toString(16).padStart(24, "0");

  class FakeDocument {
    [key: string]: any;

    public constructor(data: Record<string, any>) {
      Object.assign(this, data);
      this._id ??= makeId();
      counter += 1;
    }

    public async save() {
      return this;
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

  const hasField = (doc: RecordData, key: string) => doc[key] !== undefined;

  const valueMatches = (doc: RecordData, key: string, expected: any): boolean => {
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if ("$exists" in expected) {
        return Boolean(expected.$exists) === hasField(doc, key);
      }

      if ("$gt" in expected) {
        const actual = doc[key];
        const comparisonValue: unknown = expected.$gt;

        if (actual instanceof Date && comparisonValue instanceof Date) {
          return actual.getTime() > comparisonValue.getTime();
        }

        return Number(actual) > Number(comparisonValue);
      }
    }

    return doc[key] === expected;
  };

  const matches = (doc: RecordData, filter: QueryFilter = {}) =>
    Object.entries(filter).every(([key, value]) => {
      if (key === "$or" && Array.isArray(value)) {
        return value.some((item) => matches(doc, item));
      }

      return valueMatches(doc, key, value);
    });

  const applyUpdate = (doc: RecordData, update: QueryFilter): void => {
    if ("$set" in update && typeof update.$set === "object") {
      Object.assign(doc, update.$set);
      return;
    }

    Object.assign(doc, update);
  };

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

  const findOneAndUpdate = (
    store: Map<string, RecordData>,
    filter: QueryFilter,
    update: QueryFilter
  ) => {
    const doc = [...store.values()].find((item) => matches(item, filter));

    if (!doc) {
      return Promise.resolve(null);
    }

    applyUpdate(doc, update);
    return Promise.resolve(doc);
  };

  const updateMany = (store: Map<string, RecordData>, filter: QueryFilter, update: QueryFilter) => {
    let modifiedCount = 0;

    for (const doc of store.values()) {
      if (matches(doc, filter)) {
        applyUpdate(doc, update);
        modifiedCount += 1;
      }
    }

    return Promise.resolve({ modifiedCount });
  };

  class UserModel extends FakeDocument {
    public override async save() {
      this.email = String(this.email).toLowerCase();
      this.normalizedEmail ??= this.email;

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
        applyUpdate(doc, update);
      }
      return Promise.resolve(doc ?? null);
    }

    public static updateMany(filter: QueryFilter, update: QueryFilter) {
      return updateMany(users, filter, update);
    }

    public static find(filter: QueryFilter = {}) {
      return query([...users.values()].filter((user) => matches(user, filter)));
    }
  }

  class DoctorModel extends FakeDocument {
    public override async save() {
      this.email = String(this.email).toLowerCase();
      this.normalizedEmail ??= this.email;
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
        applyUpdate(doc, update);
      }
      return Promise.resolve(doc ?? null);
    }

    public static updateMany(filter: QueryFilter, update: QueryFilter) {
      return updateMany(doctors, filter, update);
    }

    public static find(filter: QueryFilter = {}) {
      return query([...doctors.values()].filter((doctor) => matches(doctor, filter)));
    }
  }

  class AppointmentModel extends FakeDocument {
    public override async save() {
      appointments.set(this._id, this as RecordData);
      return this;
    }

    public static findById(id: string) {
      return query(appointments.get(id) ?? null);
    }

    public static findByIdAndUpdate(id: string, update: QueryFilter) {
      const doc = appointments.get(id);
      if (doc) {
        applyUpdate(doc, update);
      }
      return Promise.resolve(doc ?? null);
    }

    public static find(filter: QueryFilter = {}) {
      return query(
        [...appointments.values()].filter((appointment) => matches(appointment, filter))
      );
    }
  }

  class AuthSessionModel extends FakeDocument {
    public override async save() {
      sessions.set(this.sessionId, this as RecordData);
      return this;
    }

    public static findOne(filter: QueryFilter) {
      return Promise.resolve(
        [...sessions.values()].find((session) => matches(session, filter)) ?? null
      );
    }

    public static findOneAndUpdate(filter: QueryFilter, update: QueryFilter) {
      return findOneAndUpdate(sessions, filter, update);
    }

    public static updateMany(filter: QueryFilter, update: QueryFilter) {
      return updateMany(sessions, filter, update);
    }
  }

  class AuthChallengeModel extends FakeDocument {
    public override async save() {
      challenges.set(this._id, this as RecordData);
      return this;
    }

    public static findOne(filter: QueryFilter) {
      return Promise.resolve(
        [...challenges.values()].find((challenge) => matches(challenge, filter)) ?? null
      );
    }

    public static findOneAndUpdate(filter: QueryFilter, update: QueryFilter) {
      return findOneAndUpdate(challenges, filter, update);
    }

    public static findByIdAndUpdate(id: string, update: QueryFilter) {
      const doc = challenges.get(String(id));
      if (doc) {
        applyUpdate(doc, update);
      }
      return Promise.resolve(doc ?? null);
    }

    public static updateMany(filter: QueryFilter, update: QueryFilter) {
      return updateMany(challenges, filter, update);
    }
  }

  const patientPassword = "PatientPass12!";
  const doctorPassword = "DoctorPass12!";

  const reset = () => {
    users.clear();
    doctors.clear();
    appointments.clear();
    sessions.clear();
    challenges.clear();
    counter = 10;

    users.set(
      ids.user,
      new FakeDocument({
        _id: ids.user,
        name: "Patient One",
        email: "patient@example.com",
        normalizedEmail: "patient@example.com",
        password: `hashed:${patientPassword}`,
        image: "image",
        phone: "1234567890",
        address: { line1: "Line 1", line2: "Line 2" },
        gender: "Male",
        dob: "2000-01-01",
        emailVerified: true,
        accountStatus: "ACTIVE",
        failedLoginAttempts: 0,
        authenticationProvider: "LOCAL"
      }) as RecordData
    );

    users.set(
      ids.otherUser,
      new FakeDocument({
        _id: ids.otherUser,
        name: "Patient Two",
        email: "other@example.com",
        normalizedEmail: "other@example.com",
        password: `hashed:${patientPassword}`,
        image: "image",
        phone: "1234567890",
        address: { line1: "Line 1", line2: "Line 2" },
        gender: "Female",
        dob: "2000-01-01",
        emailVerified: true,
        accountStatus: "ACTIVE",
        failedLoginAttempts: 0,
        authenticationProvider: "LOCAL"
      }) as RecordData
    );

    users.set(
      ids.unverifiedUser,
      new FakeDocument({
        _id: ids.unverifiedUser,
        name: "Pending Patient",
        email: "pending@example.com",
        normalizedEmail: "pending@example.com",
        password: `hashed:${patientPassword}`,
        image: "image",
        emailVerified: false,
        accountStatus: "PENDING_VERIFICATION",
        failedLoginAttempts: 0,
        authenticationProvider: "LOCAL"
      }) as RecordData
    );

    users.set(
      ids.suspendedUser,
      new FakeDocument({
        _id: ids.suspendedUser,
        name: "Suspended Patient",
        email: "suspended@example.com",
        normalizedEmail: "suspended@example.com",
        password: `hashed:${patientPassword}`,
        image: "image",
        emailVerified: true,
        accountStatus: "SUSPENDED",
        failedLoginAttempts: 0,
        authenticationProvider: "LOCAL"
      }) as RecordData
    );

    doctors.set(
      ids.doctor,
      new FakeDocument({
        _id: ids.doctor,
        name: "Doctor One",
        email: "doctor@example.com",
        normalizedEmail: "doctor@example.com",
        password: `hashed:${doctorPassword}`,
        image: "image",
        speciality: "General physician",
        degree: "MBBS",
        experience: "5 Years",
        about: "About",
        available: true,
        fees: 500,
        slots_booked: {},
        address: { line1: "Clinic", line2: "City" },
        date: Date.now(),
        emailVerified: true,
        accountStatus: "ACTIVE",
        failedLoginAttempts: 0,
        authenticationProvider: "LOCAL"
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

  return {
    ids,
    reset,
    users,
    doctors,
    appointments,
    sessions,
    challenges,
    patientPassword,
    doctorPassword,
    UserModel,
    DoctorModel,
    AppointmentModel,
    AuthSessionModel,
    AuthChallengeModel
  };
});

vi.mock("../src/models/User.js", () => ({ default: fakeDb.UserModel }));
vi.mock("../src/models/Doctor.js", () => ({ default: fakeDb.DoctorModel }));
vi.mock("../src/models/Appointment.js", () => ({ default: fakeDb.AppointmentModel }));
vi.mock("../src/models/AuthSession.js", () => ({ default: fakeDb.AuthSessionModel }));
vi.mock("../src/models/AuthChallenge.js", () => ({ default: fakeDb.AuthChallengeModel }));
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(async (password: string) => `hashed:${password}`),
    compare: vi.fn(async (password: string, hash: string) => hash === `hashed:${password}`)
  }
}));

describe("MedFlow backend foundation and Phase 1B authentication", () => {
  let app: Express;
  let emailService: typeof import("../src/services/emailService.js");

  const strongPassword = "NewPatient12!";
  const tokenFor = (id: string) =>
    jwt.sign({ id, role: "patient" }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

  const latestPreviewToken = (purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET") => {
    const item = [...emailService.getDevelopmentEmailOutbox()]
      .reverse()
      .find((message) => message.purpose === purpose);
    return item?.previewToken;
  };

  const latestPreviewOtp = (
    purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_VERIFICATION"
  ) => {
    const item = [...emailService.getDevelopmentEmailOutbox()]
      .reverse()
      .find((message) => message.purpose === purpose);
    return item?.previewOtp;
  };

  const cookieFrom = (response: request.Response) => {
    const cookie = response.headers["set-cookie"];
    return Array.isArray(cookie) ? cookie[0] : String(cookie);
  };

  beforeAll(async () => {
    app = (await import("../src/app.js")).default;
    emailService = await import("../src/services/emailService.js");
  });

  beforeEach(() => {
    fakeDb.reset();
    emailService.clearDevelopmentEmailOutbox();
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

  it("registers a patient safely and sends a verification challenge", async () => {
    const response = await request(app)
      .post("/api/user/register")
      .send({
        name: "New Patient",
        email: "New.Patient@Example.com",
        password: strongPassword,
        confirmPassword: strongPassword,
        role: "admin"
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeUndefined();
    expect(response.body.data.account.email).toBe("new.patient@example.com");
    expect(response.body.data.account.role).toBe("patient");
    expect(response.body.data.account.emailVerified).toBe(false);
    expect(response.body.data.account.password).toBeUndefined();
    expect(fakeDb.users.get(response.body.data.account.id)?.accountStatus).toBe(
      "PENDING_VERIFICATION"
    );
    expect(latestPreviewToken("EMAIL_VERIFICATION")).toBeTruthy();
  });

  it("rejects weak registration passwords and duplicate patient emails", async () => {
    await request(app)
      .post("/api/user/register")
      .send({ name: "A", email: "bad-email", password: "short" })
      .expect(400);

    const duplicate = await request(app)
      .post("/api/user/register")
      .send({
        name: "Patient One",
        email: "patient@example.com",
        password: strongPassword
      })
      .expect(409);

    expect(duplicate.body.message).toContain("email");
  });

  it("logs in patients with access token and HttpOnly refresh cookie", async () => {
    const response = await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com", password: fakeDb.patientPassword })
      .expect(200);

    expect(response.body.token).toBeTruthy();
    expect(response.body.data.account.role).toBe("patient");
    expect(cookieFrom(response)).toContain(`${process.env.COOKIE_NAME ?? "medflow_refresh"}=`);
    expect(cookieFrom(response)).toContain("HttpOnly");
    expect(fakeDb.sessions.size).toBe(1);
  });

  it("uses equivalent invalid credential behavior for wrong and unknown patient logins", async () => {
    const wrong = await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com", password: "WrongPatient12!" })
      .expect(401);
    const unknown = await request(app)
      .post("/api/user/login")
      .send({ email: "unknown@example.com", password: "WrongPatient12!" })
      .expect(401);

    expect(wrong.body.message).toBe("Invalid email or password");
    expect(unknown.body.message).toBe("Invalid email or password");
  });

  it("enforces unverified, suspended, and temporary lockout policies", async () => {
    await request(app)
      .post("/api/user/login")
      .send({ email: "pending@example.com", password: fakeDb.patientPassword })
      .expect(403);

    await request(app)
      .post("/api/user/login")
      .send({ email: "suspended@example.com", password: fakeDb.patientPassword })
      .expect(403);

    for (let index = 0; index < 3; index += 1) {
      await request(app)
        .post("/api/user/login")
        .send({ email: "patient@example.com", password: "WrongPatient12!" })
        .expect(401);
    }

    await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com", password: fakeDb.patientPassword })
      .expect(423);
  });

  it("preserves doctor and admin login compatibility", async () => {
    const doctor = await request(app)
      .post("/api/doctor/login")
      .send({ email: "doctor@example.com", password: fakeDb.doctorPassword })
      .expect(200);
    const admin = await request(app)
      .post("/api/admin/login")
      .send({ email: "admin@example.com", password: "Password123" })
      .expect(200);

    expect(doctor.body.token).toBeTruthy();
    expect(admin.body.token).toBeTruthy();
  });

  it("refreshes with rotation and detects old refresh-token reuse", async () => {
    const login = await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com", password: fakeDb.patientPassword })
      .expect(200);
    const oldCookie = cookieFrom(login);

    const refresh = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", oldCookie)
      .send({})
      .expect(200);
    const newCookie = cookieFrom(refresh);

    expect(refresh.body.data.accessToken).toBeTruthy();
    expect(newCookie).not.toBe(oldCookie);

    await request(app).post("/api/v1/auth/refresh").set("Cookie", oldCookie).send({}).expect(401);
    expect([...fakeDb.sessions.values()][0]?.revocationReason).toBe("refresh-token-reuse-detected");
  });

  it("logs out current and all sessions", async () => {
    const login = await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com", password: fakeDb.patientPassword })
      .expect(200);

    await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookieFrom(login))
      .send({})
      .expect(200);
    expect([...fakeDb.sessions.values()][0]?.revocationReason).toBe("logout");

    const first = await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com", password: fakeDb.patientPassword })
      .expect(200);
    await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com", password: fakeDb.patientPassword })
      .expect(200);

    await request(app)
      .post("/api/v1/auth/logout-all")
      .set("Authorization", `Bearer ${first.body.token}`)
      .send({})
      .expect(200);

    expect([...fakeDb.sessions.values()].filter((session) => !session.revokedAt)).toHaveLength(0);
  });

  it("verifies email tokens and rejects reuse", async () => {
    await request(app)
      .post("/api/user/register")
      .send({
        name: "Verify Patient",
        email: "verify@example.com",
        password: strongPassword
      })
      .expect(201);

    const token = latestPreviewToken("EMAIL_VERIFICATION");
    expect(token).toBeTruthy();

    await request(app).post("/api/v1/auth/verify-email").send({ token }).expect(200);
    expect(
      [...fakeDb.users.values()].find((user) => user.email === "verify@example.com")?.emailVerified
    ).toBe(true);
    await request(app).post("/api/v1/auth/verify-email").send({ token }).expect(400);
  });

  it("handles password recovery with generic forgot response and session revocation", async () => {
    const login = await request(app)
      .post("/api/user/login")
      .send({ email: "patient@example.com", password: fakeDb.patientPassword })
      .expect(200);

    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "patient@example.com" })
      .expect(200);
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "missing@example.com" })
      .expect(200);

    const token = latestPreviewToken("PASSWORD_RESET");
    expect(token).toBeTruthy();

    await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token, password: "ChangedPass12!", confirmPassword: "ChangedPass12!" })
      .expect(200);

    expect(
      [...fakeDb.sessions.values()].find((session) => session.refreshTokenHash)?.revocationReason
    ).toBe("password-reset");
    await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", cookieFrom(login))
      .send({})
      .expect(401);
    await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token, password: "AnotherPass12!", confirmPassword: "AnotherPass12!" })
      .expect(400);
  });

  it("rejects reused and weak reset passwords", async () => {
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "patient@example.com" })
      .expect(200);
    const token = latestPreviewToken("PASSWORD_RESET");

    await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token, password: "short", confirmPassword: "short" })
      .expect(400);

    await request(app)
      .post("/api/v1/auth/reset-password")
      .send({
        token,
        password: fakeDb.patientPassword,
        confirmPassword: fakeDb.patientPassword
      })
      .expect(400);
  });

  it("sends and verifies OTP codes with purpose binding and attempt limits", async () => {
    await request(app)
      .post("/api/v1/auth/otp/request")
      .send({ email: "pending@example.com", purpose: "EMAIL_VERIFICATION" })
      .expect(200);

    const otp = latestPreviewOtp("EMAIL_VERIFICATION");
    expect(otp).toBeTruthy();

    await request(app)
      .post("/api/v1/auth/otp/verify")
      .send({ email: "pending@example.com", purpose: "PASSWORD_RESET", otp })
      .expect(400);
    await request(app)
      .post("/api/v1/auth/otp/verify")
      .send({ email: "pending@example.com", purpose: "EMAIL_VERIFICATION", otp: "000000" })
      .expect(400);
    await request(app)
      .post("/api/v1/auth/otp/verify")
      .send({ email: "pending@example.com", purpose: "EMAIL_VERIFICATION", otp })
      .expect(200);

    expect(fakeDb.users.get(fakeDb.ids.unverifiedUser)?.emailVerified).toBe(true);
  });

  it("rejects missing, invalid, wrong-type, and password-stale access tokens", async () => {
    await request(app).get("/api/user/get-profile").expect(401);
    await request(app).get("/api/user/get-profile").set("token", "not-a-real-token").expect(401);

    const refreshLike = jwt.sign(
      {
        tokenType: "refresh",
        role: "patient",
        sessionId: "session",
        tokenId: "token",
        tokenFamilyId: "family"
      },
      process.env.JWT_REFRESH_SECRET as string,
      {
        subject: fakeDb.ids.user,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        expiresIn: "1h"
      }
    );
    await request(app)
      .get("/api/user/get-profile")
      .set("Authorization", `Bearer ${refreshLike}`)
      .expect(401);

    const staleToken = jwt.sign(
      { tokenType: "access", role: "patient", id: fakeDb.ids.user },
      process.env.JWT_ACCESS_SECRET as string,
      {
        subject: fakeDb.ids.user,
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        expiresIn: "1h"
      }
    );
    fakeDb.users.get(fakeDb.ids.user)!.passwordChangedAt = new Date(Date.now() + 1000);

    await request(app)
      .get("/api/user/get-profile")
      .set("Authorization", `Bearer ${staleToken}`)
      .expect(401);
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
