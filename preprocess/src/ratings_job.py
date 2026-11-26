from pyspark.sql import SparkSession
from pyspark.sql import functions as F

from dataset import valid_status


def main():
    spark = (
        SparkSession.builder.master("local")
        .appName("Word Count")
        .config("spark.some.config.option", "some-value")
        .getOrCreate()
    )
    df = spark.read.csv("data/responses_synthetic.csv", header=True, inferSchema=False)
    df = df.filter(F.col("rating").isin(valid_status))
    df = df.drop_duplicates(["response_id"])
    df = df.groupBy("rating").count().orderBy("rating")

    print("===== Final Rating Counts =====")
    df.show()

    total = df.agg(F.sum("count").alias("total")).collect()[0]["total"]
    print(f"Total valid unique responses: {total}")

    spark.stop()


if __name__ == "__main__":
    main()
