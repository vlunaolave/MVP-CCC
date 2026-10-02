import type { CompanyRepository } from "@/server/repositories/interfaces";
import { RepositoryNotImplemented } from "@/server/errors";

export class ApiCompanyRepository implements CompanyRepository {
  search(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  findById(): Promise<never> {
    throw new RepositoryNotImplemented();
  }

  graph(): Promise<never> {
    throw new RepositoryNotImplemented();
  }
}
