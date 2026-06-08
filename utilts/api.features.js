class APIFeatures {
  constructor(query, queryString, allowedFields = []) {
    this.query = query;
    this.queryString = queryString;
    this.allowedFields = allowedFields;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const filters = JSON.parse(queryStr);

    Object.keys(filters).forEach((key) => {
      if (!this.allowedFields.includes(key)) {
        delete filters[key];
      }
    });

    this.query = this.query.find(filters);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort
        .split(",")
        .filter((field) => this.allowedFields.includes(field.replace("-", "")))
        .join(" ");

      if (sortBy) {
        this.query = this.query.sort(sortBy);
      }
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields
        .split(",")
        .filter((f) => this.allowedFields.includes(f))
        .join(" ");

      if (fields) {
        this.query = this.query.select(fields);
      }
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Math.min(Number(this.queryString.limit) || 100, 100);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
