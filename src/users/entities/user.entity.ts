import { UserRole } from '../enums/user-role.enum';
import { UserDocument } from '../models/user.model';

export class User {
  constructor(
    public id: string,
    public email: string,
    public username: string,
    public roles?: UserRole,
    public fullName?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  static fromDocument(document: UserDocument): User {
    return new User(
      document._id.toString(),
      document.email,
      document.username,
      document.role,
      document.fullName,
      document.createdAt,
      document.updatedAt,
    );
  }

  static fromDocuments(documents: UserDocument[]): User[] {
    return documents.map((document) => User.fromDocument(document));
  }
}
