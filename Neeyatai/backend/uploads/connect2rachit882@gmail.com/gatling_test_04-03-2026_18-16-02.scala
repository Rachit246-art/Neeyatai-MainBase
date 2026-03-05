package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class GetUsersSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .userAgentHeader("Gatling/PerformanceTest")

  val scn = scenario("Get Users Scenario")
    .exec(http("Get all users")
      .get("/users")
      .check(status.is(200)))

  setUp(
    scn.inject(
      rampUsers(80).during(15.seconds)
    )
  ).protocols(httpProtocol)
}