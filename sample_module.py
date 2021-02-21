from datetime import date
import json
from random import randint


def generate_random_no(a, b):
  """Just a Demo function

  Args:
    a (integer): first parameter
    b (integer): second parameter

  Returns:
    integer: sum of a and b
  """
  #  return a random number
  print("date is %s" % date.today())
  print("random number in [%s,%s] is %s" % (a, b, randint(a, b)))
  # customize tags from settings.json
  #  TODO - change return
  # FIXME - fix me tag demo
  # HACK - hackk tag demo
  # NOTE - note tag demo
  # BUG - bug tag demo
  return a + b


generate_random_no(1, 10)


items = json.loads('[{"a": 1, "b": 2},{ "a":3, "b":5}]')

for item in items:
  print(item["a"])

response = items.json()


d = {"a": 1, "b": 2, "c": 3}
