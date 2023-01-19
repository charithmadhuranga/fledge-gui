import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfigurationService, RolesService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';
import { chain } from 'lodash';

@Component({
  selector: 'app-config-children',
  templateUrl: './config-children.component.html',
  styleUrls: ['./config-children.component.css']
})
export class ConfigChildrenComponent {
  selectedGroup = 'Default Configuration';
  useCategoryChildrenProxy = 'true';
  categoryKey = '';
  // categoryChildren = [];
  @Input() category;
  groups = [];
  @Input() plugin;
  @Input() serviceStatus = false;
  @Input() from;

  pages = ['south', 'north'];

  @Output() changedConfigEvent = new EventEmitter<any>();
  @Output() formStatusEvent = new EventEmitter<boolean>();

  // To hold the changed configuration values of a plugin
  configFormValues = {};


  constructor(
    private configService: ConfigurationService,
    public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService
  ) { }

  ngOnInit() {
    this.categeryConfiguration();
    this.getChildConfigData();
  }

  public updateCategroyConfig(config) {
    this.category.config = config;
    this.categeryConfiguration();
  }

  categeryConfiguration() {
    console.log('category', this.category);
    const configItems = Object.keys(this.category.config).map(k => {
      this.category.config[k].key = k;
      return this.category.config[k];
    });

    this.groups = chain(configItems).groupBy(x => x.group).map((v, k) => {
      if (k != "undefined") {
        return { category: this.category.key, group: k, config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })) }
      } else {
        // return { group: "Default", values: v }
        return { category: this.category.key, group: "Default Configuration", config: Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } })) }
      }
    }).value();

    console.log('groups', this.groups);

  }


  public getChildConfigData() {
    if (this.category) {
      this.categoryKey = this.category.key;
      this.checkIfAdvanceConfig(this.category.key)
    }
  }

  checkIfAdvanceConfig(categoryName: string) {
    this.configService.getCategoryConfigChildren(categoryName).
      subscribe(
        (data: any) => {
          const categoryChildren = data.categories?.filter(cat => (cat.key == `${this.categoryKey}Advanced`) || (cat.key == `${this.categoryKey}Security`));
          categoryChildren.forEach(cat => {
            // Set group of advance/security configuration
            cat.group = cat?.key.includes(`${this.categoryKey}Advanced`) ? 'Advanced Configuration' :
              (cat?.key.includes(`${this.categoryKey}Security`) ? 'Security Configuration' : cat?.displayName);
            // Get child category configuration
            this.getConfig(cat);
          });
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  /**
   * Set configuration of the selected child category
   * @param category Object{key, description, displayName}
   */
  selectTab(tab: string) {
    if (tab !== this.selectedGroup) {
      this.selectedGroup = tab;
    }
  }

  /**
   * Get configuration of the child category
   * @param categoryName : String
   */
  getConfig(category: any) {
    this.configService.getCategory(category.key).
      subscribe(
        (data: any) => {
          if (category.key === `${this.categoryKey}Advanced`) {
            // category.config = { key: category.key, value: data };
            this.groups.push({ category: category.key, group: category.group, config: data });
          } else if (category.key === `${this.categoryKey}Security`) {
            this.groups.push({ category: category.key, group: category.group, config: data });
          }
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  upsertConfiguration(array, element) {
    const i = array.findIndex(_element => _element.category === element.category);
    if (i > -1) {
      array[i] = element;
    }
    else {
      array.push(element);
    }
  }

  getChangeConfiguration(values: {}) {
    this.configFormValues = Object.assign({}, this.configFormValues, values);
    this.changedConfigEvent.emit(this.configFormValues)
  }

  formStatus(status: boolean) {
    this.formStatusEvent.emit(status);
  }
}
