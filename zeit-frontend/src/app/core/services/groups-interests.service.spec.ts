import { TestBed } from '@angular/core/testing';
import { GroupsInterestsService } from './groups-interests.service';

describe('GroupsInterestsService', () => {
  let service: GroupsInterestsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupsInterestsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
