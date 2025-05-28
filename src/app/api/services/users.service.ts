import { Injectable } from "@angular/core";
import { BaseService } from "./_base.service";
import { User } from "../model/users.model";

@Injectable({
  providedIn: "root",
})

export class UsersService extends BaseService<User> {
  constructor() {
    super('/users');
  }
}
