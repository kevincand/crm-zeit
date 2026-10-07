import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupsInterestsComponent } from './groups-interests.component';

describe('GroupsInterests', () => {
  let component: GroupsInterestsComponent;
  let fixture: ComponentFixture<GroupsInterestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupsInterestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupsInterestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
